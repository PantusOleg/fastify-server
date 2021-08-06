import { build } from "./app";

const server = build();

server.listen(8080, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});
