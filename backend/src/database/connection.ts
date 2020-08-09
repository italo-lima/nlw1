import kanex from "knex"
import path from "path"

const connection = kanex({
  client: 'sqlite3',
  connection: {
    filename: path.resolve(__dirname, 'database.sqlite')
  },
  useNullAsDefault: true
})

export default connection