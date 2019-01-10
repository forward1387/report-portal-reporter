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

            it("Long Name: Od	qn;oknasolxkcna[oaSCM[PO’lansc[pánosÇLKNaslknÁLKSNCLaknsc’lknadsjfbajhsdvfjahsbdf;kajsbdfkbasdkfjbaksjdbsdakjbdkjksdja.kjdbskjdb.kfjabs.kdjfbaksjdbf.skadajdn;flkÁSPDOFKJQNEIJKGBKSAJBDGLJAKSHJE'SPDOakrhfgjakssznd;laknsdgkahbnskj,dnfc;ak,jdfbngkamjsbdn;flja,snbdgk.jabfs;dkjfbaksjdbfk.ajsbfdk.", function() {
                expect(true).to.be.equal(true);
            });
        });
    });
});