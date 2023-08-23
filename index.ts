import DiscordJS, { EmbedBuilder } from "discord.js";
import dotenv from "dotenv";
const { BigQuery } = require("@google-cloud/bigquery");

export const bigqueryBot = async () => {
    dotenv.config();

    const client = new DiscordJS.Client({
        intents: ["Guilds", "GuildMessages"],
    });

    const getBigqueryRows = async () => {
        const bigquery = new BigQuery({
            projectId: process.env.PROJECT_ID,
            credentials: {
                client_email: process.env.GCP_CLIENT_EMAIL,
                private_key:
                    process.env.GCP_PRIVATE_KEY?.split("\\n").join("\n"),
            },
        });

        const query =
            "SELECT distinct counts FROM `tides-saas-309509.917302307943.trackers_all` where period = 'platform.day' and inserted_at > current_date() LIMIT 100";

        // For all options, see https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/query
        const options = {
            query: query,
            // Location must match that of the dataset(s) referenced in the query.
            location: "US",
        };

        // Run the query as a job
        const [job] = await bigquery.createQueryJob(options);

        console.log(`Job ${job.id} started.`);

        // Wait for the query to finish
        const [rows] = await job.getQueryResults();

        return rows;
    };

    const buildMessage = (counts: any) => {
        let statsName = "";
        let statsValue = "";

        const countsObject = JSON.parse(counts);

        const storeValue = [];

        for (const [key, value] of Object.entries(countsObject)) {
            storeValue.push({ label: key, value: value });
        }

        storeValue.sort((a: any, b: any) => b.value - a.value);

        storeValue.forEach((value) => {
            statsName = statsName + value.label + "\n";
            statsValue = statsValue + value.value + "\n";
        });

        const finalMessage = new EmbedBuilder()
            .setColor("#5eba7d")
            .setTitle("Date: " + new Date().toLocaleDateString())
            .setDescription("Daily platform feature stats")
            .addFields([
                {
                    name: "Stats",
                    value: statsName,
                    inline: true,
                },
                {
                    name: "Count",
                    value: statsValue,
                    inline: true,
                },
            ]);

        return finalMessage;
    };

    const sendMessagetoDiscord = async () => {
        const rows = await getBigqueryRows();
        // Print the results

        if (rows.length === 0) {
            return;
        }

        const finalMessage = buildMessage(rows[0].counts);

        const guildId = process.env.GUILD_ID || "";
        const channelId = process.env.CHANNEL_ID || "";

        const guild = client.guilds.cache.get(guildId);

        let channels;

        if (guild) {
            channels = guild.channels;
        } else {
            channels = client.channels;
        }

        const channel = channels.cache.get(channelId);

        if (channel?.isTextBased()) {
            channel.send({ embeds: [finalMessage] });
        }
    };

    await client.login(process.env.BOT_TOKEN);
    await sendMessagetoDiscord();
};
