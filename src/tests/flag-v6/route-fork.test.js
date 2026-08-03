import { FLAG_FORK_INVENTORY } from '../support/flag-v6'
import { describeRouteForkContract } from '../shared/flag-v6/route-fork.contract'

/**
 * Instantiates the route-fork contract for EVERY route entry in the inventory
 * (spec flag-v6-coverage, req 2.1/2.2): 15 component forks × 2 modes. A new
 * fork added to the registry gains both cases automatically (req 2.3).
 */
FLAG_FORK_INVENTORY.routes.forEach(describeRouteForkContract)
