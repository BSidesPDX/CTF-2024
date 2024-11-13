import app/middleware.{basic_middleware, log_request}
import app/views
import gleam/bool
import gleam/dynamic.{type Dynamic}
import gleam/http.{Get, Post}
import gleam/http/request.{type Request as BackendRequest, get_header}
import gleam/httpc
import gleam/int
import gleam/json
import gleam/list
import gleam/result
import gleam/string
import gleam/string_builder
import wisp.{type Request, type Response}

const app_name = "medusurf"

pub fn handle_request(req: Request) -> Response {
  use req <- basic_middleware(req)
  use req <- log_request(req)

  let assert Ok(priv_dir) = wisp.priv_directory(app_name)
  use <- wisp.serve_static(req, under: "/css", from: priv_dir <> "/static/css")
  use <- wisp.serve_static(req, under: "/js", from: priv_dir <> "/static/js")

  case wisp.path_segments(req) {
    [] -> index(req)
    ["health"] -> wisp.ok() |> wisp.html_body(string_builder.from_string("ok"))
    ["proxy"] -> proxy(req)
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
  // apparently someone blocked our UA, so use the browser's if available
  use user_agent <- get_user_agent(req)
  use json_body <- wisp.require_json(req)
  use proxy_url <- parse_proxy_body(json_body)
  use base_req <- init_proxy_request(proxy_url)

  wisp.log_info(string.concat(["HOST ", base_req.host]))
  use <- filter_bad_urls(base_req.host)

  let req = {
    base_req
    |> request.prepend_header("accept", "*/*")
    |> request.prepend_header("user-agent", user_agent)
  }

  [
    "proxying request to { ",
    proxy_url,
    " } with user agent { ",
    user_agent,
    " }",
  ]
  |> string.concat
  |> wisp.log_info

  let resp = httpc.send(req)

  resp
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

fn get_user_agent(req: Request, handler: fn(String) -> Response) -> Response {
  req
  |> get_header("user-agent")
  |> result.unwrap("medusurf proxy 1.0.2")
  |> handler
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

fn filter_bad_urls(host: String, handler: fn() -> Response) -> Response {
  let should_block = {
    ["localhost", "internal", "local"]
    |> list.any(fn(banned_suffix: String) {
      string.ends_with(host, banned_suffix)
    })
    |> bool.or(is_ip_addr(host))
  }
  case should_block {
    True -> {
      ["blocked proxy request for host ", host]
      |> string.concat
      |> wisp.log_info

      wisp.bad_request()
    }
    False -> handler()
  }
}

fn is_ip_addr(host: String) -> Bool {
  // shortcut for perf - these strings only get so long,
  // and ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff is just
  // 39 characters
  string.length(host) < 40
  // assume it's an IP if all parts are numeric
  && case string.contains(host, ":") {
    True ->
      string.split(host, ":")
      |> list.all(fn(part) {
        case int.base_parse(part, 16) {
          Error(_) -> False
          Ok(_) -> True
        }
      })
    False ->
      string.split(host, ".")
      |> list.all(fn(part) {
        // httpc treats hex IPv4 as a domain names, which is probably fine,
        // and octal will also parse as valid base-10 so no need to special-case it
        case int.base_parse(part, 10) {
          Error(_) -> False
          Ok(_) -> True
        }
      })
  }
}
