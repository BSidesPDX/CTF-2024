import app/router
import gleam/erlang/process
import gleam/http/request.{type Request as HttpRequest, set_header}
import gleam/http/response.{type Response as HttpResponse}
import gleam/int
import gleam/list
import gleam/result
import gleam/string
import mist
import wisp
import wisp/wisp_mist

pub fn main() {
  wisp.configure_logger()
  let secret_key_base = wisp.random_string(64)

  let assert Ok(_) =
    wisp_mist.handler(router.handle_request, secret_key_base)
    |> wrap_handler
    |> mist.new
    |> mist.port(8080)
    |> mist.start_http

  process.sleep_forever()
}

fn wrap_handler(
  handler: fn(HttpRequest(mist.Connection)) -> HttpResponse(mist.ResponseData),
) -> fn(HttpRequest(mist.Connection)) -> HttpResponse(mist.ResponseData) {
  fn(req: HttpRequest(mist.Connection)) {
    let client_ip = {
      req.body
      |> mist.get_client_info
      |> result.map(fn(val) {
        let mist.ConnectionInfo(_, ip_addr) = val
        ip_address_to_string(ip_addr)
      })
      |> result.unwrap("null")
    }

    req
    |> set_header("x-client-ip", client_ip)
    |> handler
  }
}

/// This is a hack because mist.ip_address_to_string isn't available until 3.0.0
/// and wisp@latest currently requires mist<3.0.0
fn ip_address_to_string(ip_addr: mist.IpAddress) -> String {
  case ip_addr {
    mist.IpV4(a, b, c, d) ->
      [a, b, c, d] |> list.map(int.to_string) |> string.join(with: ".")
    mist.IpV6(a, b, c, d, e, f, g, h) ->
      [a, b, c, d, e, f, g, h]
      |> list.map(int.to_string)
      |> string.join(with: ":")
  }
}
