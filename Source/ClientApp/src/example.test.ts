import packageJson from "../package.json";

describe("Package", () => {
    it("should contain version", () => {
        expect(packageJson.version).toBeDefined();
    });
});
