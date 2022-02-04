import { version } from "../package.json";

describe("Package", () => {
    it("should contain version", () => {
        expect(version).toBeDefined();
    });
});
