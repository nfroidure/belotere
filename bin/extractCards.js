const {
  CARDS_SUITS,
  CARDS_FACES
} = require('../components/cards');

const fs = require('fs');
const path = require('path');
const identity = a => a;
const SVGO = require('svgo');

function optimizeCard(config) {
  return new Promise((resolve, reject) => {
    fs.readFile(
      path.join(__dirname, '..', 'public', 'images', 'svg-cards.svg'), 'utf8',
      (err, data) => {
        let svgo;
        if (err) {
            reject(err);
        }
        svgo = new SVGO(config);

        svgo.optimize(data, (result) => {
          if (err) {
              reject(err);
          }
          resolve(result.data);
        });
    });
  });
}

function saveCard(filename, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(
      path.join(__dirname, '..', 'public', 'images', 'cards', filename + '.svg'),
      data,
      'utf8',
      (err) => {
        if (err) {
            reject(err);
        }
        resolve();
      }
    );
  });
}

function buildIds(keptId) {
  return Object.keys(CARDS_SUITS).reduce((ids, suitName) => {
    return ids.concat(
      Object.keys(CARDS_FACES)
      .map(key => CARDS_FACES[key].name)
      .concat(['2', '3', '4', '5', '6'])
      .map((cardName) => {
        return cardName + '_' + suitName;
      })
      .concat([
        'back',
        'red_joker',
        'black_joker',
      ])
      .filter(id => id !== keptId)
    );
  }, []);
}

function extractCard(id) {
  const config = {
    full: true,
    plugins: [
      {
        removeDimensions: {}
      },
      {
        removeViewBox: {}
      },
      {
        removeElementsByAttr: {
          id: buildIds(id)
        }
      }
    ]
  };

  return optimizeCard(config)
  .then((data) => {
    const origX = -.2;
    const origY = -236;
    const origWidth = 2178.99;
    const origHeight = 1216.19;
    const cardWidth = 169.012;
    const cardHeigth = 244.549;

    const matches = /<use xlink:href="#base" x="([\d\.]+)" y="([\d\.]+")\/>/.exec(data);
    const x = parseInt(matches[1], 10);
    const y = parseInt(matches[2], 10);

    return data
    .replace(' viewBox="-.2 -236 2178.99 1216.19"', ' viewBox="0 0" width="169.012" height="244.549"')
    .replace(
      '<g id="' + id + '">',
      '<g id="' + id + '" transform="translate(' +
        ((-x) - origX) +
        ',' +
        ((-y) - origY) +
      ')">'
    );
  })
  .then(saveCard.bind(null, id))
  .then(() => {
    //console.log(cardName, suitName, JSON.stringify(config, null, 2));
  });
}

Promise.all(
  Object.keys(CARDS_SUITS).map((suitName) => {
    return Promise.all(
      Object.keys(CARDS_FACES)
      .map(key => CARDS_FACES[key].name)
      .map((cardName) => {
        return extractCard(cardName + '_' + suitName);
      })
    );
  })
  .concat([
    extractCard('back')
  ])
)
.then(() => console.log('Done'))
.catch(err => console.error(err.stack));
