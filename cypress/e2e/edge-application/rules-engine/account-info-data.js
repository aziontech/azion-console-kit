const accountInfo = {
  id: 24739,
  name: "uniqueName211124164046847",
  company_name: "companyName211124164046847",
  full_name: "Azion Tecnologies",
  city: "Pago Pago",
  region: "Eastern District",
  country: "American Samoa",
  kind: "client",
  address: "13, Elm Street",
  complement: "Apt. 123",
  postal_code: "14055-010",
  first_login: false,
  is_client_only: true,
  disclaimer: "",
  status: "REGULAR"
};

const accountInfoWithFlagBlockApiv4 = () => {
  const data = {
    ...accountInfo,
    client_flags: [
      "allow_console",
      "force_redirect_to_console",
      "waf_mode",
      "block_apiv4_incompatible_endpoints"
    ]
  }
  return data
}

const accountInfoNotFlagBlockApiv4 = () => {
  const data = {
    ...accountInfo,
    client_flags: [
      "allow_console",
      "force_redirect_to_console",
      "waf_mode"
    ]
  }
  return data
}

export {
  accountInfoWithFlagBlockApiv4,
  accountInfoNotFlagBlockApiv4
}
