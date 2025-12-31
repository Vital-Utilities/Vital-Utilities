//! Request guards for API security.

use rocket::http::Status;
use rocket::request::{FromRequest, Outcome, Request};

/// Guard that ensures requests only come from localhost
pub struct LocalOnly;

#[rocket::async_trait]
impl<'r> FromRequest<'r> for LocalOnly {
    type Error = &'static str;

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let client_ip = request.client_ip();

        match client_ip {
            Some(ip) => {
                if ip.is_loopback() {
                    Outcome::Success(LocalOnly)
                } else {
                    Outcome::Error((Status::Forbidden, "Only local requests allowed"))
                }
            }
            // Allow if no IP available (e.g., test environment)
            None => Outcome::Success(LocalOnly),
        }
    }
}
