<h1 align="center">
  Azion Console Kit 💻🚀🧡
</h1>
<p align="center">

## Introduction 📖

**Azion Console Kit** is a front-end development kit made in Vue/Vite with the PrimeVue and Tailwind framework that allows you to run a customized [Azion Console](https://console.azion.com/) interface.

This project is part of Azion, an edge computing platform that allows you to build and run applications anywhere. You'll find our products and services on it. 🚀

## Getting Started 🔛

### Requirements

Before you begin, ensure that you have the following:

- [Node.js](https://nodejs.org/) version 18 or later
- [Yarn](https://yarnpkg.com/) package manager

### Setup

1. Clone the repository and navigate to the root folder.

```bash
git clone git@github.com:aziontech/azion-console-kit.git
cd azion-console-kit
```

2. Install dependencies and start the project:

```bash
  $ yarn install
  $ yarn dev --host
```

The webapp becomes available at [http://localhost:5173](http://localhost:5173).

### Using Docker

If you prefer not to run things on your machine, you can use Docker:

```bash
alias yarn="docker run -it --rm -p 5173:5173 -v $HOME:/root -v $PWD:/usr/src/app -w /usr/src/app node:18 yarn"
```

## Configuration 💻

### Personal token

For a faster setup, create a personal token via [Azion Console](https://console.azion.com/) and save it in a `.env.development` file:

```bash
echo 'VITE_PERSONAL_TOKEN=PERSONALTOKEN' > .env.development
```

### API configuration

By default, Azion Console Kit uses the **STAGE** stack to connect with Azion APIs. To point your application to the **PRODUCTION** stack, add the following command in the `.env.development` file:

```bash
VITE_ENVIRONMENT='PRODUCTION'
```

## Running on the Edge 🚀

Azion Console Kit can run natively on Azion's edge using Azion CLI (version >= 0.70.0). Follow these steps:

1. Download and configure Azion CLI with a personal token:

```bash
curl https://downloads.azion.com/linux/x86_64/azioncli -o azioncli && chmod +x azioncli
./azioncli configure -t PERSONALTOKEN
```

2. Build the bundler and copy the content from `dist` to `.edge/statics`

```bash
yarn build
mkdir -p .edge/statics && cp -r ./dist/* .edge/statics
```

3. Publish the edge application:

```bash
azioncli edge_applications init --name azion-platform-kit --type vue --mode deliver

azioncli edge_applications publish --debug
```

After a few seconds, access your project on the domain provided by the CLI:

```bash
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

## Features ⛮

Azion Console Kit includes the following features:

- Multi-tenancy: build your Azion Console by consuming endpoints from the [Azion Public API](https://api.azion.com/).
- Customizable UI: configure theme tokens or generate them automatically via the Builder, giving the UI the look and feel you need.
- Simple structure: layered separation of blocks, components, and services for easy route building.

## Contributions 🤝

Before beginning development or contributing to the project, familiarize yourself with the following resources:

- Contributor Guide ([CONTRIBUTING.md](CONTRIBUTING.md)): learn how to contribute to this project and the processes to do so.
- Development Guide ([DEVELOPER.md](DEVELOPER.md)): learn how to set up your development environment.
- Contributor Covenant Code of Conduct ([CODE_OF_CONDUCT](CODE_OF_CONDUCT.md)): understand how to maintain the quality and integrity of the project.

## Community 💬 

You can find us on:

- [Discord](https://discord.com/invite/Yp9N7RMVZy)
- [X](https://twitter.com/aziontech) 
- [LinkedIn](https://www.linkedin.com/company/aziontech)
- [YouTube](https://www.youtube.com/aziontech)

Move to the Edge! 🌎➡️🧡
