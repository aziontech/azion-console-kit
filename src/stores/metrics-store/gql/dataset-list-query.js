/**
 * List all datasets and fields
 */
export default `query {
  __type(name: "Query") {
    fields {
      name,
      type {
        ofType {
          fields {
            name
            description
            args {
              description
              name
            }
          }
        }
      }
    }
  }
}`
