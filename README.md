# MunchCord Bot

The MunchCord Bot aims to be a multi-purpose bot that can add Ordinal/Inscription functionality to any discord server.

It is created by the [Block Munchers](https://blockmunchers.com/links) team, for use in their [community discord server](https://discord.gg/munchers) but it's designed to be open to the whole community, we're in this together after all ✌️

The initial scope is to facilitate automated Role assignment based on proof of inscription ownership. Server admins can designate specific roles for combinations of inscriptions ids, usually entire collections are referenced to a single Role. Users can verify their ownership via BIP-322 signatures.

## Adding the Bot

It's super easy, you dont need any tech, the Block Muncher team already host the bot. Just hit the following link to add it to your server:

👉 [Invite Link](https://munchbot.blockmunchers.com) 👈

That's it, you're good to go!

We've been careful to ensure we use as few permissions as possible, you won't find any Admin access requirements with this bot, all it requires is:

- Manage Role
- Send Messages
- Use Application Commands

## Important Notes

If you see this:

<img width="373" alt="image" src="https://user-images.githubusercontent.com/127023971/228488566-f8f0c53f-67a9-4934-bf82-c1842921ddcd.png">

You must ensure that `RoleBot` is higher in the priority list than the roles it assigns, simply drag it up the roles list.

This can also happen when you attempt to assign a role thats owned by another integration, such as server boost.

## BIP-322 Verification Notes

The general premise from the server admin side, is to designate a specific Verify channel, and activate the bot with `/channel-add`.

This will show a persistent `Verify` message in the channel, new users simply click the button and begin the verification process.

You can add as many collections as you want, just call `/collection-add` to set up manual groups of inscriptions, or use `/collection-marketplace` to automagically grab the data from venues like Magic Eden.

> **Note**
> Collections are _channel specific_: this allows you to have different setups for different groups of user.

## Using a private channel

If you want to use the bot in a private channel, you must specifically add the `MunchBot` role to the private channel so that the bot can send messages. If not, you will see this message:

<img width="531" alt="image" src="https://user-images.githubusercontent.com/127023971/234398040-32d1d42e-9cb1-4f27-a21e-61fddfb23571.png">

## Adding features

We'd really welcome new features being added to the bot, just submit a PR, make sure you've applied the project lint/prettier settings with:

```
npm run lint
npm run prettier
```

Special bonus prizes for those who add tests, you can run them with:

```
npm test
```

## Self Hosting

1. [Setting up a bot application](https://discordjs.guide/preparations/setting-up-a-bot-application.html)
2. [Adding your bot to servers](https://discordjs.guide/preparations/adding-your-bot-to-servers.html)
3. Copy `.env.example` to `.env.local` and update the values:

- `TOKEN`: The token from the discord bot dash
- `APPLICATION_ID`: The application id from the discord application page
- `RPC_HOST`: Hostname/IP for a BIP-322 enabled bitcoin node
- `RPC_PORT`: Port for the RPC
- `RPC_USERNAME`: Username for auth
- `RPC_PASSWORD`: Password for auth
- `DB_URL`: Fully qualified URL for DB connection
- `INSCRIPTION_API`: The inscription API to use, expects URI filter for the inscription id lookup
- `ADDRESS_API`: An API that can be used to list all the inscriptions within an address
- `BIP_MESSAGE`: Set to a string if you want a static BIP-322 message challenge

4.  Install dependencies with `npm i`
5.  Deploy commands with `npm run deploy`
6.  Run bot with `npm start`
7.  Invite bot to your server ensure you have the relevant permissions in the URL: `&permissions=2415921152&scope=bot`

Set `NODE_ENV` to `production` if you don't want verbose logging.

## Docker

A new package is created on every merge to `main`.

```
docker build .
docker run -it -v "$PWD/storage:/home/node/app/data" <image> /bin/bash
```
