import Action from "../action/index.js";

/**
 * Execute the json keys diff action, print its results and return a corresponding exit code
 *
 * @param {Object} options Action options
 * @returns {number} exit code
 */
export default function exec(options) {
  const action = new Action(options);
  const missing = action.run();

  const keys = Object.keys(missing);

  if (keys.length === 0) {
    console.log("No differences found in files!!");
    return 0;
  }

  console.log("Differences found on the next files:");

  keys.forEach((key) => {
    console.log(key);

    missing[key].forEach((item) => {
      console.log(`- ${item}`);
    });
  });

  return 1;
}
