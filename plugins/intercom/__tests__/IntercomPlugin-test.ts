import DOMUtils from "#SRC/js/utils/DOMUtils";

import PluginSDK from "PluginSDK";

jest.setMock("react-router", {
  hashHistory: {
    location: { pathname: "/foo" },
    listen() {}
  }
});

const mockAuthStore = {
  getUser: jest.fn(),
  isLoggedIn: jest.fn()
};

jest.mock("#SRC/js/stores/AuthStore", () => mockAuthStore);

const SDK = PluginSDK.__getSDK("intercom", { enabled: true });
require("../SDK").default.setSDK(SDK);

const IntercomHooks = require("../hooks").default;

describe("IntercomHooks", () => {
  describe("Listeners", () => {
    beforeEach(() => {
      DOMUtils.appendScript = jasmine.createSpy();
    });

    describe("#pluginsConfigured", () => {
      it("appends scripts to the document head if plugin enabled", () => {
        window.analytics = { ready() {} };
        IntercomHooks.initialize({ appId: "id-123" });
        SDK.Hooks.doAction("pluginsConfigured");
        expect(DOMUtils.appendScript.calls.count()).toEqual(1);
      });
    });
  });
});
