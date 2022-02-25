use log::error;
use serde::Serialize;

pub async fn post_request<T: Serialize>(request: T, url: String) {
    let client = reqwest::Client::new();
    let res = client.post(url).json(&request).send().await;
    match res {
        Ok(res) => {
            if res.status() != 200 {
                error!("{}", res.status());
            }
        }
        Err(e) => {
            error!("{:?}", e);
        }
    }
}
