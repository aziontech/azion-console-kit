import { usersService } from '@/services/v2/users/users-service'
import { teamsService } from '@/services/v2/teams/teams-service'
import { loadAccountDetailsService } from './get-account-detail-service'
import { listCountriesPhoneService } from './list-countries-phone-service'
import { listTimezonesService } from './list-timezones-service'
import { loadAnotherUserService } from './load-another-user-service'

const listUsersService = usersService.listUsers
const deleteUsersService = usersService.deleteUser
const createUsersService = usersService.createUser
const editAnotherUserService = usersService.editAnotherUser
const editUsersService = usersService.editUser
const inviteYourTeamService = usersService.inviteTeamMember
const listTeamsService = teamsService.useListTeams
const getUserFromCache = usersService.getUserFromCacheById
const loadUserSettings = usersService.loadUserSettings

export {
  listUsersService,
  createUsersService,
  inviteYourTeamService,
  deleteUsersService,
  loadAccountDetailsService,
  listCountriesPhoneService,
  listTimezonesService,
  listTeamsService,
  loadUserSettings,
  editAnotherUserService,
  editUsersService,
  loadAnotherUserService,
  getUserFromCache
}
