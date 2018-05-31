const Promise = require('bluebird');
const _ = require('lodash');
const exec = require('child_process').exec;
const execPromise = Promise.promisify(exec);


class SentiStrength {
    constructor(sentiStrengthPath) {
        this.sentiStrengthPath = sentiStrengthPath;
    }

    detectSentiment(messages) {
        if (!_.isArray(messages)) {
            messages = [messages];
        }
        const strToCommand = messages.map((message) => {
            const clearedString = !message ? " " : message.replace(/\&|\n|\r|>|\"|`|\$|\/|\||\'|\+|!i|\}|!|\\|<|>|\:|\]|\[|\?|\-|\||\.|\(|\)|\|\—|\=|\^ /g, ' ').replace(/\\/g, '\\\\');
            return `"${clearedString}"`;
        }).join(" ");
        return execPromise(`cd ${this.sentiStrengthPath}/ && java -jar sentiment.jar ${strToCommand}`, {
            maxBuffer: (1024 * 1024) * 100
        }).then(function(result) {
            const results = _.tail(result.split('----start---'));
            return results.map((result) => {
                const lines = _.initial(result.split("\n"));
                const wholeTextText = _.last(lines);
                const perSubjectText = _.last(_.initial(lines));
                const files = _.initial(lines);
                const wholeTextTextValues = wholeTextText.match(/=(.*?)\,+/g);
                try {
                    const wholeText = eval('const wholeText = ' + wholeTextText.replace(/=/g, ":") + "; wholeText;");
                    const perSubject = eval('const perSubject =' + perSubjectText.replace(/=/g, ":") + "; perSubject;");
                    return {
                        wholeTextText: wholeTextText,
                        perSubjectText: perSubjectText,
                        wholeText: wholeText,
                        perSubject: perSubject
                    };
                } catch (e) {
                    return {
                        error: e.message
                    };
                }

            });
        });
    }

    apply(obj, field, callback, grouped) {
        if (_.isFunction(field)) {
            grouped = callback;
            callback = field;
            field = "comment";
        }
        if (grouped) {
            const comments = _.map(obj, field).map((c) => {
                return c && c.length < 10000 ? c : "#too_big_to_evaluate#";
            });
            this.detectSentiment(comments, grouped).then((sentistrengths) => {
                sentistrengths.forEach((sentistrength, i) => {
                    if (obj[i]) {
                        obj[i].sentistrength_new = sentistrength;
                    } else {
                        throw new Error(`Error ${i} did not return a valid value. Report this issue to sentiStrength-node.js`);
                    }
                });
                callback();
            });
        } else {
            if (obj[field]) {
                this.detectSentiment(obj[field], grouped).then((sentistrength) => {
                    obj.sentistrength_new = _.fist(sentistrength);
                    callback();
                });
            } else {
                callback();
            }
        }
    }
}
module.exports.SentiStrength = SentiStrength;
