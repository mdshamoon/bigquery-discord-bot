import {
    Handler,
    HandlerEvent,
    HandlerContext,
    schedule,
} from "@netlify/functions";
import { bigqueryBot } from "../..";

const myHandler: Handler = async (
    event: HandlerEvent,
    context: HandlerContext
) => {
    await bigqueryBot();

    return {
        statusCode: 200,
    };
};

const handler = schedule("30 3 * * *", myHandler);

export { handler };
