use std::cmp;

use sysinfo::{NetworkExt, SystemExt};
use vital_service_api::models::{
    IpInterfaceProperties, NetAdapterUsage, NetworkAdapterProperties, NetworkAdapterUsage,
};

pub async fn get_net_adapters(sysinfo: &sysinfo::System) -> Vec<NetworkAdapterUsage> {
    let mut list = Vec::new();
    let mut utils = Vec::new();

    let networks = sysinfo.networks();

    for data in networks {
        utils.push(data);
    }

    for (_, int) in default_net::get_interfaces().into_iter().enumerate() {
        let stats = utils.get(int.index as usize);
        list.push(NetworkAdapterUsage {
            properties: Box::new(NetworkAdapterProperties {
                is_up: int.is_up(),
                name: int.friendly_name.unwrap_or(int.name),
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
            usage: stats.map(|stats| {
                Box::new(NetAdapterUsage {
                    send_bps: stats.1.transmitted() as i64,
                    recieve_bps: stats.1.received() as i64,
                    usage_percentage: None,
                })
            }),
        });
    }

    list
}
