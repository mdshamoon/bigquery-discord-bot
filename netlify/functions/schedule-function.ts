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
    console.log("Received event:");
    bigqueryBot();

    return {
        statusCode: 200,
    };
};

const handler = schedule("@yearly", myHandler);

export { handler };
