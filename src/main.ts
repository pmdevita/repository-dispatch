import * as core from '@actions/core'
import * as github from '@actions/github'
import {createOAuthAppAuth} from '@octokit/auth-oauth-app'
import {Octokit} from '@octokit/rest'
import {inspect} from 'util'

async function run(): Promise<void> {
  try {
    const inputs = {
      token: core.getInput('token'),
      repository: core.getInput('repository'),
      eventType: core.getInput('event-type'),
      clientPayload: core.getInput('client-payload'),
      clientID: core.getInput('client-id'),
      clientSecret: core.getInput('client-secret')
    }
    core.debug(`Inputs: ${inspect(inputs)}`)

    const [owner, repo] = inputs.repository.split('/')

    const octokit = (() => {
      if (inputs.token !== '') {
        return github.getOctokit(inputs.token)
      } else if (inputs.clientID !== '' && inputs.clientSecret !== '') {
        return new Octokit({
          authStrategy: createOAuthAppAuth,
          auth: {
            clientId: inputs.clientID,
            clientSecret: inputs.clientSecret
          }
        })
      } else {
        throw new Error('No authentication strategy properly defined.')
      }
    })()

    await octokit.rest.repos.createDispatchEvent({
      owner: owner,
      repo: repo,
      event_type: inputs.eventType,
      client_payload: JSON.parse(inputs.clientPayload)
    })
  } catch (error: any) {
    core.debug(inspect(error))
    if (error.status == 404) {
      core.setFailed(
        'Repository not found, OR token has insufficient permissions.'
      )
    } else {
      core.setFailed(error.message)
    }
  }
}

run()
