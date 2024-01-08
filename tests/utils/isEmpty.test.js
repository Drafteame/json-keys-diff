import chai from "chai";
import isEmpty from "../../src/utils/isEmpty.js";

const expect = chai.expect;

describe("isEmpty", () => {
  it("should return true for null", () => {
    expect(isEmpty(null)).to.be.true;
  });

  it("should return true for undefined", () => {
    expect(isEmpty(undefined)).to.be.true;
  });

  it("should return true for an empty string", () => {
    expect(isEmpty("")).to.be.true;
  });

  it("should return true for an empty array", () => {
    expect(isEmpty([])).to.be.true;
  });

  it("should return true for an empty object", () => {
    expect(isEmpty({})).to.be.true;
  });

  it("should return false for a non-empty object", () => {
    expect(isEmpty({ key: "value" })).to.be.false;
  });

  it("should return false for a non-empty string", () => {
    expect(isEmpty("non-empty")).to.be.false;
  });

  it("should return false for a non-empty array", () => {
    expect(isEmpty([1, 2, 3])).to.be.false;
  });

  // Add more tests as needed for different cases

  // Example of testing a custom object type
  it("should handle custom object types", () => {
    // Customize this test based on your specific object type
    const customObject = { customProp: "customValue" };
    expect(isEmpty(customObject)).to.be.false;
  });
});
