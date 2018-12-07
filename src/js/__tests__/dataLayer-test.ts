import { Container, bindExtensionProvider } from "extension-kid";
import DataLayer, {
  DataLayerExtension,
  DataLayerExtensionInterface
} from "../dataLayer";
import { injectable, ContainerModule } from "inversify";
import gql from "graphql-tag";
import { marbles } from "rxjs-marbles/jest";

const JobsSymbol = Symbol("Jobs");
@injectable()
class JobsExtension implements DataLayerExtensionInterface {
  id = JobsSymbol;

  getMutationTypeDefinitions() {
    return `deleteJob(id: String): Boolean`;
  }
  getQueryTypeDefinitions() {
    return `jobs: Job`;
  }

  getResolvers(activeExtensions: symbol[]) {
    const hasJobs = activeExtensions.includes(TasksSymbol);

    const additionalJobData = hasJobs ? { taskId: "foo-task" } : {};

    return {
      Query: {
        jobs() {
          return [{ id: "foo", docker: "nginx", ...additionalJobData }];
        }
      }
    };
  }

  getTypeDefinitions(activeExtensions: symbol[]) {
    const hasJobs = activeExtensions.includes(TasksSymbol);

    return `
    type Job {
      id: String!
      docker: String!
      ${hasJobs ? "taskId: String!" : ""}
    }
    `;
  }
}

const TasksSymbol = Symbol("Tasks");
// tslint:disable-next-line
@injectable()
class TasksExtension implements DataLayerExtensionInterface {
  id = TasksSymbol;

  getMutationTypeDefinitions() {
    return `
    deleteTask(id: String): Boolean
    `;
  }
  getQueryTypeDefinitions() {
    return `
    task(id: String): Task
    `;
  }

  getResolvers() {
    return {
      Query: {
        task(_: any, args: { id?: string }) {
          const id = args.id || "unknown";
          return {
            id,
            log: id + "log"
          };
        }
      },
      Mutation: {
        deleteTask(id: string) {
          return id === "deletable-task";
        }
      },
      Job: {
        task(parent: { id: string }) {
          return {
            id: parent.id + "task",
            log: parent.id + "tasklog"
          };
        }
      }
    };
  }

  getTypeDefinitions() {
    return `
    type Task {
      id: String!
      log: String!
    }

    extend type Job {
      task: Task
    }
    `;
  }
}

const DataLayerSymbol = Symbol("DataLayer");
describe("DataLayer", () => {
  let container: Container;
  beforeEach(() => {
    container = new Container();
    const dataLayerModule = new ContainerModule(bind => {
      bindExtensionProvider(bind, DataLayerExtension);
    });

    container.load(dataLayerModule);

    container
      .bind(DataLayerSymbol)
      .to(DataLayer)
      .inSingletonScope();
  });

  // is this possible?
  it("does not error without an extension");

  it(
    "provides an extended schema",
    marbles(m => {
      m.bind();

      container
        .bind(DataLayerExtension)
        .to(JobsExtension)
        .inSingletonScope();
      container
        .bind(DataLayerExtension)
        .to(TasksExtension)
        .inSingletonScope();
      const dl: DataLayer = container.get<DataLayer>(DataLayerSymbol);
      const query = gql`
        query {
          jobs {
            id
            docker
          }
          task(id: "foo") {
            id
            log
          }
        }
      `;

      const expected$ = m.cold("(a|)", {
        a: {
          data: {
            jobs: [{ id: "foo", docker: "nginx" }],
            task: { id: "foo", log: "foolog" }
          }
        }
      });

      m.expect(dl.query(query, null).take(1)).toBeObservable(expected$);
    })
  );

  it(
    "provides an extended schema with nested types",
    marbles(m => {
      m.bind();
      const query = gql`
        query {
          jobs {
            id
            docker
            task {
              id
              log
            }
          }
          task(id: "foo") {
            id
            log
          }
        }
      `;

      container
        .bind(DataLayerExtension)
        .to(JobsExtension)
        .inSingletonScope();
      container
        .bind(DataLayerExtension)
        .to(TasksExtension)
        .inSingletonScope();
      const dl: DataLayer = container.get<DataLayer>(DataLayerSymbol);

      const expected$ = m.cold("(a|)", {
        a: {
          data: {
            jobs: [
              {
                id: "foo",
                docker: "nginx",
                task: { id: "footask", log: "footasklog" }
              }
            ],
            task: { id: "foo", log: "foolog" }
          }
        }
      });

      m.expect(dl.query(query, null).take(1)).toBeObservable(expected$);
    })
  );

  it(
    "provides an extended schema with nested types independent of import order",
    marbles(m => {
      m.bind();
      const query = gql`
        query {
          jobs {
            id
            docker
            task {
              id
              log
            }
          }
          task(id: "foo") {
            id
            log
          }
        }
      `;

      container
        .bind(DataLayerExtension)
        .to(TasksExtension)
        .inSingletonScope();
      container
        .bind(DataLayerExtension)
        .to(JobsExtension)
        .inSingletonScope();

      const dl: DataLayer = container.get<DataLayer>(DataLayerSymbol);

      const expected$ = m.cold("(a|)", {
        a: {
          data: {
            jobs: [
              {
                id: "foo",
                docker: "nginx",
                task: { id: "footask", log: "footasklog" }
              }
            ],
            task: { id: "foo", log: "foolog" }
          }
        }
      });

      m.expect(dl.query(query, null).take(1)).toBeObservable(expected$);
    })
  );

  it.skip(
    "allows to conditionally extend the schema based on active extensions",
    marbles(m => {
      m.bind();
      const query = gql`
        query {
          jobs {
            id
            docker
            taskId
          }
          task(id: "foo") {
            id
            log
          }
        }
      `;

      container
        .bind(DataLayerExtension)
        .to(JobsExtension)
        .inSingletonScope();
      const dl: DataLayer = container.get<DataLayer>(DataLayerSymbol);
      const expectedBeforeBind$ = m.cold(
        "#",
        {},
        new Error(
          "graphqlObservable error: field was not of the right type. Given type: Job"
        )
      );
      m.expect(dl.query(query, null).take(1)).toBeObservable(
        expectedBeforeBind$
      );

      container
        .bind(DataLayerExtension)
        .to(TasksExtension)
        .inSingletonScope();

      const expectedAfterBind$ = m.cold("(a|)", {
        a: {
          data: {
            jobs: [{ id: "foo", docker: "nginx", taskId: "foo-task" }],
            task: { id: "foo", log: "foolog" }
          }
        }
      });

      m.expect(dl.query(query, null).take(1)).toBeObservable(
        expectedAfterBind$
      );
    })
  );
  it("extends a schema while a query is running");
});
