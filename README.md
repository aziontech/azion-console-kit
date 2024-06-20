<h1 align="center">
  Azion Console Kit 💻🚀🧡
</h1>
<p align="center">

## Introduction 📖

**Azion Console Kit** is a front-end development kit made in Vue/Vite with the PrimeVue and Tailwind framework that allows you to run a customized [Azion Console](https://console.azion.com/) interface.

This project was developed by Azion, an edge computing platform that allows you to build and run applications anywhere. You'll find our products and services on it. 🚀

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

Azion Console Kit can run natively on Azion's edge using Azion CLI. Follow these steps:

1. [Download the Azion CLI here](https://www.azion.com/en/documentation/products/azion-cli/overview/) and configure your personal token:

    ```bash
    azion -t ${PERSONAL_TOKEN}
    ```

2. Link project to an Azion edge application.

    ```bash
    azion link
    ```

   Choose the Vue preset.

3. Publish your project to create the application's domain:

    ```bash
    azion deploy
    ```

    > This step is resposible for deploying your base project and creating a domain. This domain will be later on used to implement the configuration rules.

   💡 Tip: You can use the `--config-dir` argument to separate project environments. The CLI will use the reference to store application states. If you don't need two environments, don't pass the argument and it will use the original reference.

4. Deploy your Project

    ```bash
    azion deploy
    ```

    One of the rules used in `azion.config.cjs` _(to rewrite the authentication cookie using your domain)_ needs the created domain to work. So, **after the first deploy**, just run the `Azion deploy` command again and everything should work 🚀

After a few seconds, access your project on the domain provided by the CLI.

## Features 🧩

Azion Console Kit includes the following features:

- Multi-tenancy: build your Azion Console by consuming endpoints from the [Azion Public API](https://api.azion.com/).
- Customizable UI: configure theme tokens or generate them automatically via the Builder, giving the UI the look and feel you need.
- Simple structure: layered separation of blocks, components, and services for easy route building.

## Contributions 🤝

Before beginning development or contributing to the project, familiarize yourself with the following resources:

- Contributor Guide ([CONTRIBUTING.md](CONTRIBUTING.md)): learn how to contribute to this project and the processes to do so.
- Development Guide ([DEVELOPER.md](DEVELOPER.md)): learn how to set up your development environment.
- Security Guide ([SECURITY.md](SECURITY.md)): learn about the secutiry validaton process.
- Contributor Covenant Code of Conduct ([CODE_OF_CONDUCT](CODE_OF_CONDUCT.md)): understand how to maintain the quality and integrity of the project.

## Community 💬

You can find us on:

- [Discord](https://discord.com/invite/Yp9N7RMVZy)
- [X](https://twitter.com/aziontech)
- [LinkedIn](https://www.linkedin.com/company/aziontech)
- [YouTube](https://www.youtube.com/aziontech)

Move to the Edge! 🌎➡️🧡
