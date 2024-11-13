import gleam/option.{None}
import html_dsl/types/attribute.{class, id}
import html_dsl/types/html.{body, div, h1, header, html, p}
import html_dsl/types/html/form.{Submit, Text, form, input, label}
import html_dsl/types/html/head.{charset, head, meta, script, style, title}

pub fn index(app_name: String) -> String {
  let assert Ok(page_html) =
    html(
      lang: "en-US",
      head: head()
        |> title(app_name)
        |> charset("UTF-8")
        |> meta("viewport", "width=device-width, initial-scale=1.0")
        |> script("/js/proxy.js")
        |> style("/css/style.css")
        |> head.end,
      body: body(
        attributes: id(None, "main-content"),
        inner: header(
          class(None, "page-header"),
          h1(None, "super secure page source proxy")
            <> p(None, "enter a URL to view its source in this page")
            <> p(
            None,
            "don't worry, this proxy is super secure, works perfectly, and totally won't track you ;)",
          ),
        )
          <> div(
          attributes: id(None, "form-container") |> class("form-container"),
          inner: form(
            id(None, "proxy-form")
            |> class("proxy-form"),
          )
            |> label(None, "URL:")
            |> input(
              id(None, "proxy-form-url") |> attribute.add("name", "url"),
              Text,
              "http://example.com",
            )
            |> input(None, Submit, "submit")
            |> form.end,
        )
          <> div(
          attributes: id(None, "proxy-output-container")
            |> class("proxy-output-container"),
          inner: "<pre id=\"proxy-output\" class=\"proxy-output\">",
        ),
      ),
    )

  page_html |> html.html_to_string
}
