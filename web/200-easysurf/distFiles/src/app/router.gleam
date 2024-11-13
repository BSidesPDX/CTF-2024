import app/middleware.{basic_middleware, log_request}
import app/views
import gleam/bool
import gleam/dynamic.{type Dynamic}
import gleam/http.{Get, Post}
import gleam/http/request.{type Request as BackendRequest, get_header}
import gleam/httpc
import gleam/json
import gleam/list
import gleam/result
import gleam/string
import gleam/string_builder
import wisp.{type Request, type Response}

const app_name = "easysurf"

const user_agent = "easysurf proxy 1.0.1"

pub fn handle_request(req: Request) -> Response {
  use req <- basic_middleware(req)
  use req <- log_request(req)

  let assert Ok(priv_dir) = wisp.priv_directory(app_name)
  use <- wisp.serve_static(req, under: "/css", from: priv_dir <> "/static/css")
  use <- wisp.serve_static(req, under: "/js", from: priv_dir <> "/static/js")

  case wisp.path_segments(req) {
    // This matches `/`.
    [] -> index(req)
    ["proxy"] -> proxy(req)
    ["admin", _] -> admin(req, priv_dir)
    _ -> wisp.not_found()
  }
}

/// GET /
/// nothing fancy, just renders a simple HTML page
fn index(req: Request) -> Response {
  use <- wisp.require_method(req, Get)

  wisp.ok()
  |> wisp.html_body(views.index(app_name) |> string_builder.from_string)
}

/// POST /proxy
/// { "url": URL_STRING }
///
/// Attempts to fetch the provided URL and return the reponse
/// body in a JSON object: { "body": RESPONSE_BODY }
///
/// Some URLs are disallowed for security reasons.
fn proxy(req: Request) -> Response {
  use <- wisp.require_method(req, Post)
  use json_body <- wisp.require_json(req)
  use proxy_url <- parse_proxy_body(json_body)
  use base_req <- init_proxy_request(proxy_url)

  wisp.log_info(string.concat(["HOST ", base_req.host]))
  use <- filter_bad_urls(base_req.host)

  ["proxying request to { ", proxy_url, " }"]
  |> string.concat
  |> wisp.log_info

  let req = {
    base_req
    |> request.prepend_header("accept", "*/*")
    |> request.prepend_header("user-agent", user_agent)
  }

  httpc.send(req)
  |> result.map(fn(r) {
    r.body
    |> json.string
    |> fn(body) { [#("body", body)] }
    |> json.object
    |> json.to_string_builder
    |> wisp.json_response(200)
  })
  |> result.unwrap(wisp.internal_server_error())
}

/// GET  /admin/<path>
/// POST /admin/<path>
/// ...
///
/// Admin routes - pretty simple for now, but will be extended if
/// we get around to building a management console.
fn admin(req: Request, priv_dir: String) -> Response {
  use <- require_local_client(req)

  let admin_dir = priv_dir <> "/static/admin"
  use <- wisp.serve_static(req, under: "/admin", from: admin_dir)

  wisp.not_found()
}

fn parse_proxy_body(
  json_body: Dynamic,
  next: fn(String) -> Response,
) -> Response {
  let parse_result = json_body |> dynamic.field("url", dynamic.string)

  case parse_result {
    Ok(url) -> next(url)
    _ -> wisp.bad_request() |> wisp.string_body("missing `url` field")
  }
}

fn init_proxy_request(
  url: String,
  next: fn(BackendRequest(String)) -> Response,
) -> Response {
  case request.to(url) {
    Ok(req) -> next(req)
    _ -> wisp.bad_request() |> wisp.string_body("malformed URL")
  }
}

fn filter_bad_urls(host: String, next: fn() -> Response) -> Response {
  let should_block = {
    ["localhost", "internal", "127.0.0.1"]
    |> list.any(fn(banned_host: String) { string.ends_with(host, banned_host) })
  }
  case should_block {
    True -> {
      ["blocked proxy request for host ", host]
      |> string.concat
      |> wisp.log_info

      wisp.bad_request()
    }
    False -> next()
  }
}

fn require_local_client(req: Request, next: fn() -> Response) -> Response {
  req
  |> get_header("x-client-ip")
  |> result.map(fn(ip) { ip == "127.0.0.1" })
  |> result.unwrap(False)
  |> bool.lazy_guard(next, wisp.not_found)
}
