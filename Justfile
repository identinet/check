#!/usr/bin/env just --justfile
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
    let hooks_folder = '.githooks'
    let git_hooks_folder = do {git config core.hooksPath} | complete
    if $git_hooks_folder.exit_code == 0 and $git_hooks_folder.stdout != $hooks_folder {
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
    PATTERN='^(fix|feat|docs|style|chore|test|refactor|ci|build)(\\([a-z0-9/-]+\\))?!?: [a-z].+$'
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
    $services | $in.host | each {|host|
      if not ($"($certs_directory)/($host).pem" | path exists) {
        mkcert -cert-file $"($certs_directory)/($host).pem" -key-file $"($certs_directory)/($host).pem" $host
      }
    }
    let http_port = 80
    let https_port = 443
    # let http_port = 8080
    # let https_port = 8443
    {
      admin: {
        disabled: true
      }
      apps: {
        tls: {
          certificates: {
            load_folders: [$certs_directory]
          }
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
                  match: [{host: [$service.host]}]
                  handle: [
                    {
                      handler: "static_response",
                      status_code: 308,
                      headers: {
                        Location: [$"https://{http.request.host}:($https_port){http.request.uri}"]
                      }
                    }
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
                  match: [{host: [$service.host]}]
                  handle: [{
                    handler: "subroute"
                    routes: [{
                      handle: [{
                        handler: "reverse_proxy"
                        upstreams: [{dial: $":($service.port)"}]
                      }]
                    }]
                  }]
                }
              })
            }
            # | reduce --fold {} {|it, acc| $acc | upsert $it.key $it.value})
          }
        }
      }
    } | save -f $"($certs_directory)/../caddy.json"
    print "Caddy is up and running. Visit:"
    $services | $in.host | each {print $"- https://($in)(if $https_port != 443 {$":($https_port)"})"}
    print ""
    sudo caddy run --config $"($certs_directory)/../caddy.json"

# Run tests
test:
