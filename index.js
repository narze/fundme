const core = require("@actions/core")
const github = require("@actions/github")

// most @actions toolkit packages have async methods
async function run() {
  try {
    const githubToken = core.getInput("githubToken")
    const octokit = github.getOctokit(githubToken)
    const username = core.getInput("username")

    let filteredRepos = []

    let page = 1
    while (true) {
      const repos = await octokit.request("GET /users/{username}/repos", {
        username,
        type: "public",
        page,
        per_page: 100,
        mediaType: {
          previews: ["mercy"],
        },
      })

      console.log({ page, repoCount: repos.data.length })

      page += 1

      if (repos.data.length === 0) {
        break
      }

      const data = repos.data.map((repo) => ({
        full_name: repo.full_name,
        topics: repo.topics,
      }))

      filteredRepos = filteredRepos.concat(
        data.filter((repo) => repo.topics.includes("fundme"))
      )
    }

    filteredRepos.forEach(async ({ full_name }) => {
      const [owner, repo] = full_name.split("/")

      try {
        await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
          owner,
          repo,
          path: ".github/FUNDING.yml",
        })

        // Do nothing.
        console.log(`${full_name} already has a funding file.`)
      } catch (error) {
        console.log({ error })
        // Try to create a file

        await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
          owner,
          repo,
          path: ".github/FUNDING.yml",
          message: "Create FUNDING.yml",
          content: Buffer.from(`ko_fi: ${username}`).toString("base64"),
        })

        console.log(`Created funding file for ${owner}/${repo}`)
      }
    })
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
