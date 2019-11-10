jest.mock("#SRC/js/stores/DCOSStore");

const TaskIpAddressesRow = require("../TaskIpAddressesRow").default;
const renderer = require("react-test-renderer");
const React = require("react");
const DCOSStore = require("#SRC/js/stores/DCOSStore");
const Application = require("#PLUGINS/services/src/js/structs/Application");
const Pod = require("#PLUGINS/services/src/js/structs/Pod");

describe("TaskIpAddressesRow", () => {
  describe("with an Application", () => {
    const serviceMock = new Application({
      tasks: [{ id: "foo", ipAddresses: [{ ipAddress: "127.0.0.1" }] }]
    });

    beforeEach(() => {
      DCOSStore.serviceTree = {
        getServiceFromTaskID() {
          return serviceMock;
        }
      };
    });

    it("renders IP Addresses", () => {
      const taskId = "foo";

      const thisInstance = renderer.create(
        <TaskIpAddressesRow taskId={taskId} />
      );

      const tree = thisInstance.toJSON();

      expect(tree).toMatchSnapshot();
    });
  });

  describe("with a Pod", () => {
    const serviceMock = new Pod({
      instances: [{ id: "foo.bar", networks: [{ addresses: ["0.0.0.0"] }] }]
    });

    beforeEach(() => {
      DCOSStore.serviceTree = {
        getServiceFromTaskID() {
          return serviceMock;
        }
      };
    });

    it("renders IP Addresses", () => {
      const taskId = "foo.bar.container-1";

      const thisInstance = renderer.create(
        <TaskIpAddressesRow taskId={taskId} />
      );

      const tree = thisInstance.toJSON();

      expect(tree).toMatchSnapshot();
    });
  });
});
