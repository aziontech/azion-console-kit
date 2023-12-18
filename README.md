# Azion Console Kit

## Introduction

The Azion Console Kit is a front-end development kit made in Vue/Vite with the PrimeVue and Tailwind framework that allows you to run customized Azion Realtime Manager.

## Getting Started

Let’s test drive it in under 5 minutes.

We suggest using `yarn` and `node 18.*` via the instructions below, but if you don't like running things on your machine you can use docker for this.

```
alias yarn="docker run -it --rm -p 5173:5173 -v $HOME:/root -v $PWD:/usr/src/app -w /usr/src/app node:18 yarn"
```

1. To start, clone the repository and navigate to the root folder.

```cmd
git clone git@github.com:aziontech/azion-platform-kit.git
cd azion-platform-kit
```

2. Start the project using:

```cmd
  $ yarn install
  $ yarn dev --host
```

The webapp is now available on the following URL: http://localhost:5173

PRO-TIP (OPTIONAL) - To save some time, you can create a personal token in [Real Time Manager](https://manager.azion.com/iam/personal-tokens) and save it into file `.env.development`

```cmd
echo 'VITE_PERSONAL_TOKEN=PERSONALTOKEN' > .env.development
```

## Pointing the API's

Currently the Console Kit uses the STAGE stack to connect with the Azion API's.
But, if you want to point your application to PRODUCTION stack you just need to add the follow command in the `.env.development` file:

```
VITE_ENVIRONMENT='PRODUCTION'
```

## Run on the Edge

Azion Console Kit runs natively on Azion's edge thanks to Azion CLI (>= 0.70.0):

1. Download and configure Azion-CLI with a [Personal Token](https://manager.azion.com/iam/personal-tokens)

```cmd
curl https://downloads.azion.com/linux/x86_64/azioncli -o azioncli && chmod +x azioncli
./azioncli configure -t PERSONALTOKEN
```

2. Build the bundler and copy the content from `dist` to `.edge/statics`

```cmd
yarn build
mkdir -p .edge/statics && cp -r ./dist/* .edge/statics
```

3. Publish your edge application

```cmd
azioncli edge_applications init --name azion-platform-kit --type vue --mode deliver

azioncli edge_applications publish --debug
```

After a few seconds, you can access your project on the Domain informed by the CLI. This is one example of CLI output

```
$ azioncli edge_applications publish
Uploading static files
[##########] 100 .edge/statics/index.html Upload completed successfully!
Created Edge Function PLATFORM-KIT-1 with ID 10908
Created Edge Application PLATFORM-KIT-1 with ID 1694694931
Created Domain PLATFORM-KIT-1 with ID 1694690266
Created Cache Settings for web application
Created Rules Engine for web application
Your Edge Application was published successfully

To visualize your application access the domain: https://ajahphrqah.map.azionedge.net
```

Note: We are launching a new version of AzionCLI. Stay tuned for a new way to publish your Console Kit at Edge.

## Features

The top features include:

1. **Multi-tenancy:** Build your Azion Console according to your needs by consuming the endpoints from our Public API: [Azion Public API](https://api.azion.com)
2. **Customizable UI:** configure theme tokens or generate them automatically via [Builder](https://designer.primevue.org/) in your project, giving the look and feel according to your needs.
3. **Simple structure:** layered separation of blocks, components and services so that it is easy to build a new route in a very short time.

## Contributing

Before beginning development, please familiarize yourself with the following developer resources:

- Contributor Guide ([CONTRIBUTING.md](CONTRIBUTING.md)) to learn about how to contribute to this project.
- Development Guide ([DEVELOPER.md](DEVELOPER.md)): Setting up your development environment.
- [CODE_OF_CONDUCT](CODE_OF_CONDUCT.md)
