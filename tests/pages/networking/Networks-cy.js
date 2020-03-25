import { getVisibleTableRows } from "../../_support/utils/testUtil";
import fixture from "../../_fixtures/mesos/overlay-master";

describe("Networks", () => {
  context("Networks Table", () => {
    beforeEach(() => {
      cy.configureCluster({
        mesos: "1-task-healthy",
      });
      cy.visitUrl({ url: "/networking/networks" });
    });

    it("displays all of the networks in the table", () => {
      cy.get("tbody tr").should(($tableRows) => {
        expect(getVisibleTableRows($tableRows).length).to.equal(4);
      });
    });

    it("displays all columns for each network", () => {
      cy.get("tbody tr").should(($tableRows) => {
        getVisibleTableRows($tableRows).forEach((tableRow, index) => {
          const overlayData = fixture.network.overlays[index];
          const tableCells = tableRow.querySelectorAll("td");

          expect(tableCells[0].textContent).to.equal(overlayData.name);
          expect(tableCells[1].textContent).to.equal(overlayData.subnet);
          expect(tableCells[2].textContent).to.equal(
            overlayData.prefix.toString()
          );
        });
      });
    });

    it("allows users to filter the table", () => {
      cy.get("input.form-control").type(fixture.network.overlays[0].name);
      cy.get("tbody tr").should(($tableRows) => {
        expect(getVisibleTableRows($tableRows).length).to.equal(1);
      });
    });
  });

  context("Network Detail", () => {
    beforeEach(() => {
      cy.configureCluster({
        mesos: "1-task-healthy",
      });
      cy.visitUrl({ url: "/networking/networks" });
      cy.get("table tr:nth-child(2) a").click();
    });

    it("displays all columns for each network", () => {
      cy.get("tbody tr").should(($tableRows) => {
        getVisibleTableRows($tableRows).forEach((tableRow) => {
          const tableCells = tableRow.querySelectorAll("td");
          const task = fixture.frameworks[0].tasks[0];

          expect(tableCells[0].textContent).to.equal(task.id);
          expect(tableCells[1].textContent).to.equal(
            task.statuses[0].container_status.network_infos[0].ip_addresses[0]
              .ip_address
          );
          // TODO: Figure out how to determine the port mapping value from
          // the API response.
          expect(tableCells[2].textContent).to.equal("N/A");
        });
      });
    });

    it("allows users to filter the table", () => {
      cy.get(
        ".filter-bar-item .filter-input-text"
      ).type("sleep.7084272b-6b76-11e5-a953-08002719334a", { force: true });
      cy.get("tbody tr").should(($tableRows) => {
        expect(getVisibleTableRows($tableRows).length).to.equal(1);
      });
    });
  });
});
