import gleam/http
import gleam/int
import gleam/string
import wisp

pub fn basic_middleware(req: wisp.Request, handle_request:  fn(wisp.Request) -> wisp.Response,) -> wisp.Response {
  let req = wisp.method_override(req)
  use <- wisp.rescue_crashes
  use req <- wisp.handle_head(req)

  handle_request(req)
}

pub fn log_request(
  req: wisp.Request,
  handle_request: fn(wisp.Request) -> wisp.Response,
) -> wisp.Response {
  let response = handle_request(req)

  [
    http.method_to_string(req.method),
    " ",
    int.to_string(response.status),
    " ",
    req.path,
  ]
  |> string.concat
  |> wisp.log_info

  response
}
