import { parse } from 'ts-command-line-args';
import { Octokit } from "@octokit/rest";
import axios from 'axios';
import * as fs from 'fs';



type UpdateMetaData = {
    version: string,
    notes: string,
    pub_date: string,
    platforms: {
        "windows-x86_64": {
            signature: string,
            url: string
        },
        "aarch64-apple-darwin": {
            signature: string,
            url: string
        },
        "x86_64-apple-darwin": {
            signature: string,
            url: string
        }
    }  | undefined
}
const meta: UpdateMetaData = {
    notes: "",
    pub_date: "",
    version: "",
    platforms: undefined
};

const args = parse({
    releaseTag: { type: String, alias: 't', multiple: false, optional: true, defaultValue: "" },
    platform: { type: String, alias: 'p', multiple: false, optional: true, defaultValue: "" },
    outputPath: { type: String, alias: 'o', multiple: false, optional: true, defaultValue: "" }
});

const msiZipMatch = /(\.msi\.zip)$/
const msiZipSigMatch = /(\.msi\.zip\.sig)$/

const appZipMatch = /(\.app\.zip)$/
const appZipSigMatch = /(\.app\.zip\.sig)$/

const octokit = new Octokit();
const repo = {
    owner: "Vital-Utilities",
    repo: "Vital-Utilities",
}
const release = await octokit.repos.getReleaseByTag({
    owner: repo.owner,
    repo: repo.repo,
    tag: args.releaseTag
});

meta.notes = release.data.body ?? "";
meta.pub_date = new Date(release.data.published_at ?? "").toISOString();
meta.version = release.data.tag_name;

meta.platforms['windows-x86_64'].url = release.data.assets.filter(asset => msiZipMatch.test(asset.name))[0].browser_download_url;

await axios.get<string>(release.data.assets.filter(asset => msiZipSigMatch.test(asset.name))[0].browser_download_url, { responseType: 'text' })
    .then(res => res.data)
    .then(signature => {
        meta.platforms['windows-x86_64'].signature = signature;
    });


meta.platforms['aarch64-apple-darwin'].url = release.data.assets.filter(asset => appZipMatch.test(asset.name))[0].browser_download_url;

await axios.get<string>(release.data.assets.filter(asset => appZipSigMatch.test(asset.name))[0].browser_download_url, { responseType: 'text' })
    .then(res => res.data)
    .then(signature => {
        meta.platforms['aarch64-apple-darwin'].signature = signature;
    });

meta.platforms['x86_64-apple-darwin'].url = release.data.assets.filter(asset => appZipMatch.test(asset.name))[0].browser_download_url;

await axios.get<string>(release.data.assets.filter(asset => appZipSigMatch.test(asset.name))[0].browser_download_url, { responseType: 'text' })
    .then(res => res.data)
    .then(signature => {
        meta.platforms['x86_64-apple-darwin'].signature = signature;
    });

console.log(JSON.stringify(meta, null, 4));
if (args.outputPath.length > 0)
    fs.writeFileSync(args.outputPath, JSON.stringify(meta, null, 4), { encoding: 'utf8' });