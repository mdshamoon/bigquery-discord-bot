import DiscordJS, { EmbedBuilder } from "discord.js";
import dotenv from "dotenv";
const { BigQuery } = require("@google-cloud/bigquery");

export const bigqueryBot = async () => {
    console.log("wow");
    dotenv.config();

    const client = new DiscordJS.Client({
        intents: ["Guilds", "GuildMessages"],
    });

    const sendMessagetoDiscord = async () => {
        console.log(`before bigquery`);
        const bigquery = new BigQuery({
            projectId: process.env.PROJECT_ID,
            keyFilename: "./google-credentials.json",
        });

        console.log(`after bigquery`);
        // Queries the U.S. given names dataset for the state of Texas.

        const query =
            "SELECT * FROM `tides-saas-309509.917302307943.stats_all` where period = 'day' and inserted_at > current_date() LIMIT 100";

        // For all options, see https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/query
        const options = {
            query: query,
            // Location must match that of the dataset(s) referenced in the query.
            location: "US",
        };

        console.log(`Job  starting.`);
        // Run the query as a job
        const [job] = await bigquery.createQueryJob(options);
        console.log(`Job ${job.id} started.`);

        // Wait for the query to finish
        const [rows] = await job.getQueryResults();

        // Print the results

        let totalContacts = 0;
        let totalMessages = 0;

        let organizationNames = "";
        let messages = "";
        let incomingVsOutgoingMessages = "";

        rows.sort((a: any, b: any) => b.messages - a.messages);

        rows.forEach((row: any) => {
            totalContacts = totalContacts + row.contacts;
            totalMessages = totalMessages + row.messages;

            if (row.messages > 0) {
                incomingVsOutgoingMessages =
                    incomingVsOutgoingMessages +
                    row.inbound +
                    " / " +
                    row.outbound +
                    "\n";

                messages = messages + row.messages + "\n";
                organizationNames =
                    organizationNames + row.organization_name + "\n";
            }
        });

        const guildId = process.env.GUILD_ID || "";
        const channleId = process.env.CHANNEL_ID || "";

        const guild = client.guilds.cache.get(guildId);

        let channels;

        if (guild) {
            channels = guild.channels;
        } else {
            channels = client.channels;
        }

        const finalMessage = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle("Date: " + new Date().toLocaleDateString())
            .setDescription(
                "\n\n**Total contacts:** " +
                    totalContacts +
                    "\n**Messages yesterday:** " +
                    totalMessages
            )
            .addFields([
                {
                    name: "NGO name",
                    value: organizationNames,
                    inline: true,
                },
                {
                    name: "Messages",
                    value: messages,
                    inline: true,
                },
                {
                    name: "Incoming / outgoing",
                    value: incomingVsOutgoingMessages,
                    inline: true,
                },
            ]);

        const channel = channels.cache.get(channleId);
        if (channel?.isTextBased()) {
            channel.send({ embeds: [finalMessage] });
        }
    };

    await client.login(process.env.BOT_TOKEN);

    console.log("This is ready");
    sendMessagetoDiscord();
};
