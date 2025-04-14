#!/usr/bin/env -S just --justfile
# Documentation: https://just.systems/man/en/
# Documentation: https://www.nushell.sh/book/
#
# Shell decativated so that bash is used by default. This simplifies CI integration
# set shell := ['nu', '-c']
#
# Integration with nodejs package.json scripts, see https://just.systems/man/en/chapter_65.html
# export PATH := env('PWD') / 'node_modules/.bin:' + env('PATH')
#
# To override the value of SOME_VERSION, run: just --set SOME_VERSION 1.2.4 TARGET_NAME
# SOME_VERSION := '1.2.3'

# Print this help
default:
    @just -l

# Format Justfile
format:
    @just --fmt --unstable

# Install git commit hooks
githooks:
    #!/usr/bin/env nu
    $env.config = { use_ansi_coloring: false, error_style: "plain" }
    # Only install githooks in the repository's root folder
    let git_root = pwd | path split | reverse | drop (git rev-parse --show-toplevel | path split | length) | str join "/"
    if $git_root != "" {
        cd (git rev-parse --show-toplevel)
        just githooks
        return
    }
    let hooks_folder = '.githooks'
    let git_hooks_folder = do {git config core.hooksPath} | complete
    if $git_hooks_folder.stdout != $hooks_folder {
      print -e 'Installing git commit hooks'
      git config core.hooksPath $hooks_folder
      # npm install -g @commitlint/config-conventional
    }
    if not ($hooks_folder | path exists) {
      mkdir $hooks_folder
      "#!/usr/bin/env -S sh
    set -eu
    just test" | save $"($hooks_folder)/pre-commit"
      chmod 755 $"($hooks_folder)/pre-commit"
      "#!/usr/bin/env -S sh
    set -eu
    MSG_FILE=\"$1\"
    PATTERN='^(fix|feat|docs|style|chore|test|refactor|ci|build)(\\([A-Za-z0-9/_-]+\\))?!?: [a-z].+$'
    if ! head -n 1 \"${MSG_FILE}\" | grep -qE \"${PATTERN}\"; then
            echo \"Your commit message:\" 1>&2
            cat \"${MSG_FILE}\" 1>&2
            echo 1>&2
            echo \"The commit message must conform to this pattern: ${PATTERN}\" 1>&2
            echo \"Contents:\" 1>&2
            echo \"- follow the conventional commits style (https://www.conventionalcommits.org/)\" 1>&2
            echo 1>&2
            echo \"Example:\" 1>&2
            echo \"feat: add super awesome feature\" 1>&2
            exit 1
    fi" | save $"($hooks_folder)/commit-msg"
      chmod 755 $"($hooks_folder)/commit-msg"
      # if not (".commitlintrc.yaml" | path exists) {
      # "extends:\n  - '@commitlint/config-conventional'" | save ".commitlintrc.yaml"
      # }
      # git add $hooks_folder ".commitlintrc.yaml"
      git add $hooks_folder
    }

# Start caddyserver for local development
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
tunnel:
    #!/usr/bin/env nu
    # Steps to create tunnel
    # cloudflared tunnel login
    # cloudflared tunnel create $env.TUNNEL_USER
    # cloudflared tunnel route dns $env.TUNNEL_USER $"shop-($env.TUNNEL_USER).($env.TUNNEL_DOMAIN)"
    # cloudflared tunnel route dns $env.TUNNEL_USER $"vds-($env.TUNNEL_USER).($env.TUNNEL_DOMAIN)"
    cloudflared tunnel run --cred-file .cloudflared/tunnel.json --url $"http://localhost:80" $env.TUNNEL_USER

# Run tests
test:
