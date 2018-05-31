const {
    SentiStrength
} = require("../");
console.log(SentiStrength);
const should = require("should");
const sentiment = new SentiStrength('../../github-sentiment-analysis-code-smells-scripts/sentiment');
describe("applySentiment", () => {
    it("should apply the sentiment on simple tasks as a promise", () => {
        return sentiment.detectSentiment(["this is a test"]).then((result) => {
            result[0].wholeText.whole_text.scale.should.be.equal(0);
        });
    });
    it("should not consider storm a negative word", () => {
        return sentiment.detectSentiment("storm is comming").then((result) => {
            result[0].wholeText.whole_text.scale.should.be.equal(0);
        })
    });
    it("should not consider storm a negative word", () => {
        return sentiment.detectSentiment(["this is a shit commit"]).then((result) => {
            result[0].wholeText.whole_text.scale.should.be.equal(-3);
        })
    });
})
