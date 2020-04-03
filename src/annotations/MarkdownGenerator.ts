import * as vscode from "vscode";
import * as p4 from "../api/PerforceApi";

import * as PerforceUri from "../PerforceUri";
import * as DiffProvider from "../DiffProvider";
import { isTruthy } from "../TsUtils";
import { toReadableDateTime } from "../DateFormatter";

export function makeSwarmHostURL(change: p4.FileLogItem, swarmHost: string) {
    return swarmHost + "/changes/" + change.chnum;
}

function makeCommandURI(command: string, ...args: any[]) {
    const encoded = encodeURIComponent(JSON.stringify(args));
    return "command:" + command + "?" + encoded;
}

export function makeDiffURI(
    workspace: vscode.Uri,
    prevChange: p4.FileLogItem,
    change: p4.FileLogItem
) {
    const args = [
        makePerforceURI(workspace, prevChange),
        makePerforceURI(workspace, change)
    ];
    return (
        makeCommandURI("perforce.diffFiles", ...args) +
        ' "' +
        DiffProvider.diffTitleForDepotPaths(
            prevChange.file,
            prevChange.revision,
            change.file,
            change.revision
        ) +
        '"'
    );
}

function makePerforceURI(underlying: vscode.Uri, change: p4.FileLogItem) {
    return PerforceUri.fromDepotPath(underlying, change.file, change.revision);
}

function makeQuickPickURI(underlying: vscode.Uri, change: p4.FileLogItem) {
    return (
        makeCommandURI(
            "perforce.showQuickPick",
            "change",
            underlying.toString(),
            change.chnum
        ) +
        ' "Show more actions for changelist ' +
        change.chnum +
        '"'
    );
}

export function makeAnnotateURI(underlying: vscode.Uri, change: p4.FileLogItem) {
    const args = makePerforceURI(underlying, change).toString();
    return (
        makeCommandURI("perforce.annotate", args) +
        ' "Show annotations for ' +
        change.file +
        "#" +
        change.revision +
        '"'
    );
}

export function makeMarkdownLink(text: string, link: string) {
    return "\\[[" + text + "](" + link + ")\\]";
}

export function makeAllLinks(
    underlying: vscode.Uri,
    change: p4.FileLogItem,
    latestChange: p4.FileLogItem,
    prevChange?: p4.FileLogItem,
    swarmHost?: string
) {
    const diffLink = prevChange
        ? makeMarkdownLink("Diff Previous", makeDiffURI(underlying, prevChange, change))
        : undefined;
    const diffLatestLink =
        change !== latestChange
            ? makeMarkdownLink(
                  "Diff vs this Revision",
                  makeDiffURI(underlying, change, latestChange)
              )
            : undefined;
    const annotateLink =
        change !== latestChange
            ? makeMarkdownLink("Annotate", makeAnnotateURI(underlying, change))
            : undefined;
    const swarmLink = swarmHost
        ? makeMarkdownLink("Open in Swarm", makeSwarmHostURL(change, swarmHost))
        : undefined;
    const moreLink = makeMarkdownLink("More…", makeQuickPickURI(underlying, change));

    return [swarmLink, diffLink, diffLatestLink, annotateLink, moreLink]
        .filter(isTruthy)
        .join(" ");
}

function doubleUpNewlines(str: string) {
    return str.replace(/\n+/g, "\n\n");
}

export function makeUserAndDateSummary(change: p4.FileLogItem) {
    return (
        change.file +
        "#" +
        change.revision +
        "\n\n" +
        "**Change `#" +
        change.chnum +
        "`** by **`" +
        change.user +
        "`** on `" +
        toReadableDateTime(change.date) +
        "`"
    );
}

export function convertToMarkdown(description: string) {
    return doubleUpNewlines(description);
}
