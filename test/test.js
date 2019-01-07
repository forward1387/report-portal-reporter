"use strict";

const expect = require("chai").expect;

describe("first level", function() {
    it("test 1", function() {
        expect(true).to.be.equal(true);
    });

    describe("second level", () => {
        it("test 1", function() {
            expect(true).to.be.equal(true);
        });

        it("test 2", function() {
            expect(true).to.be.equal(true);
        });

        describe("third level", () => {
            it("test 1", function() {
                expect(true).to.be.equal(true);
            });
    
            it("test 2", function() {
                expect(true).to.be.equal(false);
            });
        });
    });
});