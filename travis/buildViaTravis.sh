#!/bin/bash
# This script will build the project.

echo -e "Running unit tests..."
source ~/.nvm/nvm.sh
NODE_JS_VERSION=`node -e 'console.log(require("./package.json").engines.node.replace(/[^\d\.]/g, ""))'`;
nvm install $NODE_JS_VERSION

./node_modules/.bin/karma start --single-run --coverage

# Handle release build:
if [ "$TRAVIS_PULL_REQUEST" == "false" ] && [ "$TRAVIS_TAG" != "" ]; then

  # Update version in package.json based on release tag:
  echo -e 'Updating version based on tag: ['$TRAVIS_TAG']'
  VERSION=${TRAVIS_TAG//v}
  SEARCH='("version":[[:space:]]*").+(")'
  REPLACE="\1${VERSION}\2"
  sed -i -E "s/${SEARCH}/${REPLACE}/" package.json

  # Update spinnaker/kayenta version in deck:
  echo -e 'Updating spinnaker/kayenta version in deck based on tag: ['$TRAVIS_TAG']'
  BRANCH_NAME="kayenta-version-bump"
  DECK_REPO="github.com/spinnaker/deck.git"

  git config --global user.email "spinbot@spinnaker.io"
  git config --global user.name "spinnakerbot"

  cd ..
  git clone git://${DECK_REPO}
  cd ${DECK_REPO}
  git checkout -b ${BRANCH_NAME}

  DECK_SEARCH='("@spinnaker\/kayenta":[[:space:]]*").+(")'
  sed -i -E "s/${DECK_SEARCH}/${REPLACE}/" package.json

  git add .
  git commit --message "Automatically bump spinnaker/kayenta version"
  git remote add origin https://${GH_TOKEN}@${DECK_REPO}
  git push origin ${BRANCH_NAME} -f

  # Open pull request using GitHub API:
  curl -X POST spinnakerbot:${GH_TOKEN} /repos/spinnaker/deck/pulls --data '{"title":"Bump @spinnaker/kayenta version","head":"kayenta-version-bump","base":"master","body":"This is an automated PR to bump the @spinnaker/kayenta version based on a new release tag"}'
fi
