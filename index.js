const core = require("@actions/core")
const github = require("@actions/github")
const wait = require("./wait")

// most @actions toolkit packages have async methods
async function run() {
  try {
    const ms = core.getInput("milliseconds")
    core.info(`Waiting ${ms} milliseconds ...`)

    core.debug(new Date().toTimeString()) // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true
    await wait(parseInt(ms))
    core.info(new Date().toTimeString())

    core.setOutput("time", new Date().toTimeString())

    const githubToken = core.getInput("githubToken")
    const octokit = github.getOctokit(githubToken)

    const username = "narze"

    const repos = await octokit.rest.repos.listForUser({
      username,
    })

    const data = repos.data.map((repo) => ({
      full_name: repo.full_name,
      topics: repo.topics,
    }))

    console.log({ data })
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
