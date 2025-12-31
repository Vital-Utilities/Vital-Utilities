use std::cmp;
use std::collections::HashMap;
use std::sync::Mutex;

use once_cell::sync::Lazy;
use sysinfo::Networks;
use vital_service_api::models::{
    IpInterfaceProperties, NetAdapterUsage, NetworkAdapterProperties, NetworkAdapterUsage,
};

// Persistent Networks instance for tracking traffic over time
static NETWORKS: Lazy<Mutex<Networks>> = Lazy::new(|| Mutex::new(Networks::new_with_refreshed_list()));

// Store previous network stats to calculate rates
static PREV_STATS: Lazy<Mutex<HashMap<String, (u64, u64, std::time::Instant)>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

pub async fn get_net_adapters() -> Vec<NetworkAdapterUsage> {
    let mut list = Vec::new();

    // Refresh the persistent Networks instance to get updated stats
    let mut networks = NETWORKS.lock().unwrap();
    networks.refresh(true);

    // Get network stats from sysinfo - this gives us traffic data
    let network_stats: HashMap<String, (u64, u64)> = networks
        .iter()
        .map(|(name, data)| (name.clone(), (data.received(), data.transmitted())))
        .collect();

    drop(networks); // Release the lock early

    let now = std::time::Instant::now();

    for (_, int) in default_net::get_interfaces().into_iter().enumerate() {
        let interface_type = &int.if_type;
        let interface_name = int.name.clone();
        let friendly_name = int.friendly_name.clone().unwrap_or(interface_name.clone());
        let has_ipv4 = !int.ipv4.is_empty();

        // Only include Ethernet and Wi-Fi adapters that are actually connected
        // (have an IPv4 address assigned)
        let is_wifi_or_ethernet = matches!(
            interface_type,
            default_net::interface::InterfaceType::Ethernet
                | default_net::interface::InterfaceType::Wireless80211
        );

        if !is_wifi_or_ethernet || !has_ipv4 {
            continue;
        }

        // Look up network stats by interface name
        let current_stats = network_stats.get(&interface_name);

        // Calculate bytes per second by comparing with previous values
        let usage = if let Some(&(received, transmitted)) = current_stats {
            let mut prev_stats = PREV_STATS.lock().unwrap();
            let (recv_bps, send_bps) = if let Some(&(prev_recv, prev_send, prev_time)) =
                prev_stats.get(&interface_name)
            {
                let elapsed = now.duration_since(prev_time).as_secs_f64();
                if elapsed > 0.0 {
                    let recv_delta = received.saturating_sub(prev_recv);
                    let send_delta = transmitted.saturating_sub(prev_send);
                    (
                        ((recv_delta as f64 / elapsed) * 8.0) as i64, // Convert bytes to bits
                        ((send_delta as f64 / elapsed) * 8.0) as i64,
                    )
                } else {
                    (0, 0)
                }
            } else {
                (0, 0)
            };

            // Update previous stats
            prev_stats.insert(interface_name.clone(), (received, transmitted, now));

            Some(Box::new(NetAdapterUsage {
                send_bps,
                recieve_bps: recv_bps,
                usage_percentage: None,
            }))
        } else {
            None
        };

        list.push(NetworkAdapterUsage {
            properties: Box::new(NetworkAdapterProperties {
                is_up: int.is_up(),
                name: friendly_name,
                description: int.description,
                mac_address: int.mac_addr.map(|e| e.address()),
                ip_interface_properties: Some(Box::new(IpInterfaceProperties {
                    i_pv4_address: Some(int.ipv4.into_iter().map(|x| x.addr.to_string()).collect()),
                    i_pv6_address: Some(int.ipv6.into_iter().map(|x| x.addr.to_string()).collect()),
                    is_dns_enabled: None,
                    dns_suffix: None,
                })),
                speed_bps: Some(cmp::max(
                    int.transmit_speed.unwrap_or_default(),
                    int.receive_speed.unwrap_or_default(),
                ) as i64),
                connection_type: match int.if_type {
                    default_net::interface::InterfaceType::Wireless80211 => {
                        Some("Wireless".to_string())
                    }
                    default_net::interface::InterfaceType::Ethernet => Some("Ethernet".to_string()),
                    rest => Some(rest.name()),
                },
            }),
            usage,
        });
    }

    list
}
