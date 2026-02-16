import { usersService } from '@/services/v2/users/users-service'
import { createUsersService } from './create-users-service'
import { inviteYourTeamService } from './invite-your-team-service'
import { deleteUsersService } from './delete-users-service'
import { loadAccountDetailsService } from './get-account-detail-service'
import { listCountriesPhoneService } from './list-countries-phone-service'
import { listTimezonesService } from './list-timezones-service'
import { teamsService } from './list-teams-service'
import { editAnotherUserService } from './edit-another-user-service'
import { loadUserService } from './load-user-service'
import { editUsersService } from './edit-users-service'
import { loadAnotherUserService } from './load-another-user-service'

const listUsersService = usersService.listUsers
const listTeamsService = teamsService.useListTeams
const getUserFromCache = usersService.getUserFromCacheById
export {
  listUsersService,
  createUsersService,
  inviteYourTeamService,
  deleteUsersService,
  loadAccountDetailsService,
  listCountriesPhoneService,
  listTimezonesService,
  listTeamsService,
  loadUserService,
  editAnotherUserService,
  editUsersService,
  loadAnotherUserService,
  getUserFromCache
}
