#!/usr/bin/env node

const core = require("@actions/core");
const { context, GitHub } = require("@actions/github");

async function run() {
    const trigger = core.getInput("trigger", { required: true });

    const reaction = core.getInput("reaction");
    const { GITHUB_TOKEN } = process.env;
    if (reaction && !GITHUB_TOKEN) {
        core.setFailed('If "reaction" is supplied, GITHUB_TOKEN is required');
        return;
    }

    const body =
        (context.eventName === "issue_comment"
        // For comments on pull requests
            ? context.payload.comment.body
            // For the initial pull request description
            : context.payload.pull_request.body) || '';
    core.setOutput('comment_body', body);
    core.setOutput("url", "all");
    core.setOutput("query", "many");
    core.setOutput("users", "5");
    core.setOutput("rate", "5");
    core.setOutput("runtime", "10s");
    const params = body.split(" ");

    for (const i in params) {
        const splitData = i.split(":");
        if (splitData[0] == "url") {
            core.setOutput("url", splitData[1]);
        } else if (splitData[0] == "query") {
            core.setOutput("query", splitData[1]);
        } else if (splitData[0] == "users") {
            core.setOutput("users", splitData[1]);
        } else if (splitData[0] == "rate") {
            core.setOutput("rate", splitData[1]);
        } else if (splitData[0] == "runtime") {
            core.setOutput("runtime", splitData[1]);
        }
    }
    if (
        context.eventName === "issue_comment" &&
        !context.payload.issue.pull_request
    ) {
        // not a pull-request comment, aborting
        core.setOutput("triggered", "false");
        return;
    }

    const { owner, repo } = context.repo;


    const prefixOnly = core.getInput("prefix_only") === 'true';
    if ((prefixOnly && !body.startsWith(trigger)) || !body.includes(trigger)) {
        core.setOutput("triggered", "false");
        return;
    }

    core.setOutput("triggered", "true");

    if (!reaction) {
        return;
    }

    const client = new GitHub(GITHUB_TOKEN);
    if (context.eventName === "issue_comment") {
        await client.reactions.createForIssueComment({
            owner,
            repo,
            comment_id: context.payload.comment.id,
            content: reaction
        });
    } else {
        await client.reactions.createForIssue({
            owner,
            repo,
            issue_number: context.payload.pull_request.number,
            content: reaction
        });
    }
}

run().catch(err => {
    console.error(err);
    core.setFailed("Unexpected error");
});
