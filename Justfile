#!/usr/bin/env -S just --justfile
# Documentation: https://just.systems/man/en/
# Documentation: https://www.nushell.sh/book/

import 'justlib/default.just'

# Print this help
default:
    @just -l

# Start caddyserver for local development
[group('development')]
dev: githooks
    #!/usr/bin/env nu
    let certs_directory = ".caddy/certs"
    mkdir $certs_directory
    # load configuration from files
    let services = glob "services/*/caddy.json" | each {open $in}
    $services | filter {$in | get -i hostname | is-not-empty} | $in.hostname | each {|hostname|
      if not ($"($certs_directory)/($hostname).pem" | path exists) {
        mkcert -cert-file $"($certs_directory)/($hostname).pem" -key-file $"($certs_directory)/($hostname).pem" $hostname
      }
    }
    def getHosts [--no-tunnel] {
      let service = $in
      let hosts = []
      let hosts = if ($service | get -i hostname | is-not-empty) {
        $hosts | append $service.hostname
      } else { $hosts }
      let hosts = if (not $no_tunnel) and ($service | get -i tunnelprefix | is-not-empty) {
        $hosts | append $"($env.TUNNEL_USER)-($service.tunnelprefix).($env.TUNNEL_DOMAIN)"
      } else { $hosts }
      $hosts
    }
    let http_port = 80
    let https_port = 443
    # let http_port = 8080
    # let https_port = 8443
    # Documentation: https://caddyserver.com/docs/json/
    {
      # acme_ca: "https://acme-staging-v02.api.letsencrypt.org/directory"
      admin: {
        disabled: true
      }
      logging: {
        logs: {
          default: {
            level: "INFO"
            # level: "DEBUG"
          }
        }
      }
      apps: {
        tls: {
          certificates: {
            load_folders: [$certs_directory]
          }
          # automation: {
          #   policies: [{
          #     issuers: [{
          #       module: "acme",
          #       ca: "https://acme-staging-v02.api.letsencrypt.org/directory"
          #       # certificate_lifetime: 4d
          #     }]
          #   }]
          # }
        }
        http: {
          # http_port: $http_port
          # https_port: $https_port
          servers: {
            http: {
              automatic_https: {disable: true}
              listen: [$":($http_port)"]
              routes: ($services | each {|service|
                {
                  match: ($service | getHosts | each {|hostname| {host: [$hostname]}})
                  handle: [
                    {
                      handler: "encode"
                      encodings: { gzip: {level: 3} zstd: {level: "default"} }
                    }
                    {
                      handler: "reverse_proxy"
                      upstreams: [{dial: $"localhost:($service.port)"}]
                    }
                    # {
                    #   handler: "static_response",
                    #   status_code: 308,
                    #   headers: {
                    #     Location: [$"https://{http.request.hostname}:($https_port){http.request.uri}"]
                    #   }
                    # }
                  ]
                }
              })
            }
            https: {
              automatic_https: {disable: true}
              tls_connection_policies: [
                { certificate_selection: {} }
              ]
              listen: [$":($https_port)"]
              routes: ($services | each {|service|
                {
                  match: ($service | getHosts --no-tunnel | each {|hostname| {host: [$hostname]}})
                  handle: [
                    {
                      handler: "encode"
                      encodings: { gzip: {level: 3} zstd: {level: "default"} }
                    }
                    {
                      handler: "reverse_proxy"
                      upstreams: [{dial: $"localhost:($service.port)"}]
                    }
                  ]
                }
              })
            }
            # | reduce --fold {} {|it, acc| $acc | upsert $it.key $it.value})
          }
        }
      }
    } | save -f $"($certs_directory)/../caddy.json"
    print "Caddy is up and running. Visit:"
    print ($services | each {|service|
      let hosts = $service | getHosts
      $hosts | each {|hostname| $"https://($hostname)(if $https_port != 443 {$":($https_port)"})" } | fill -c ' ' -w 40 | str join "or " | prepend "-" | str join " "
    } | str join "\n")
    print ""
    sudo (which caddy).0.path run --config $"($certs_directory)/../caddy.json"

# Open a cloudflare tunnel. WARNING: requires configuration that is NOT part of this project
[group('development')]
tunnel:
    #!/usr/bin/env nu
    # Steps to create tunnel
    # cloudflared tunnel login
    # cloudflared tunnel create $env.TUNNEL_USER
    # cloudflared tunnel route dns $env.TUNNEL_USER $"shop-($env.TUNNEL_USER).($env.TUNNEL_DOMAIN)"
    # cloudflared tunnel route dns $env.TUNNEL_USER $"vds-($env.TUNNEL_USER).($env.TUNNEL_DOMAIN)"
    cloudflared tunnel run --cred-file .cloudflared/tunnel.json --url $"http://localhost:80" $env.TUNNEL_USER

# Run tests - currently none
test:
