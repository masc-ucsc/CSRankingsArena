#!/bin/bash

# Comprehensive test script for Paper Evaluation League

# Set environment variables
export NODE_ENV=test
export INSTALL_PYTHON_DEPS=true

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}   Paper Evaluation League - Test Suite   ${NC}"
echo -e "${BLUE}===========================================${NC}"

# Function to run tests and check status
run_tests() {
  local test_type=$1
  local command=$2
  
  echo -e "\n${BLUE}Running $test_type tests...${NC}"
  
  # Run command
  $command
  
  # Check status
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ $test_type tests passed${NC}"
    return 0
  else
    echo -e "${RED}✗ $test_type tests failed${NC}"
    return 1
  fi
}

# Function to check if program exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check test dependencies
echo -e "\n${BLUE}Checking test dependencies...${NC}"

MISSING_DEPS=0

# Check Node.js
if command_exists node; then
  NODE_VERSION=$(node --version)
  echo -e "${GREEN}✓ Node.js $NODE_VERSION is installed${NC}"
else
  echo -e "${RED}✗ Node.js is not installed${NC}"
  MISSING_DEPS=1
fi

# Check Python
if command_exists python; then
  PYTHON_VERSION=$(python --version)
  echo -e "${GREEN}✓ $PYTHON_VERSION is installed${NC}"
else
  echo -e "${RED}✗ Python is not installed${NC}"
  MISSING_DEPS=1
fi

# Check MongoDB
if command_exists mongod; then
  MONGO_VERSION=$(mongod --version | grep "db version" | awk '{print $3}')
  echo -e "${GREEN}✓ MongoDB $MONGO_VERSION is installed${NC}"
else
  echo -e "${RED}✗ MongoDB is not installed${NC}"
  MISSING_DEPS=1
fi

# Check test frameworks
if command_exists jest; then
  JEST_VERSION=$(jest --version)
  echo -e "${GREEN}✓ Jest $JEST_VERSION is installed${NC}"
else
  echo -e "${RED}✗ Jest is not installed${NC}"
  MISSING_DEPS=1
fi

if command_exists pytest; then
  PYTEST_VERSION=$(pytest --version | awk '{print $2}')
  echo -e "${GREEN}✓ Pytest $PYTEST_VERSION is installed${NC}"
else
  echo -e "${RED}✗ Pytest is not installed${NC}"
  MISSING_DEPS=1
fi

# Exit if any dependencies are missing
if [ $MISSING_DEPS -eq 1 ]; then
  echo -e "\n${RED}Please install missing dependencies before running tests${NC}"
  echo -e "Run: npm install && pip install -r agents/requirements.txt"
  exit 1
fi

# Install dependencies if needed
if [ "$INSTALL_DEPS" = "true" ]; then
  echo -e "\n${BLUE}Installing dependencies...${NC}"
  npm install && pip install -r agents/requirements.txt
fi

# Create test directory if it doesn't exist
mkdir -p coverage

# Run all tests
ERROR_COUNT=0

# Run agent (Python) tests
run_tests "Agent (Python)" "cd agents && python -m pytest tests/ -v"
ERROR_COUNT=$((ERROR_COUNT + $?))

# Run backend tests
run_tests "Backend" "npx jest --selectProjects backend --colors"
ERROR_COUNT=$((ERROR_COUNT + $?))

# Run frontend tests
run_tests "Frontend" "npx jest --selectProjects frontend --colors"
ERROR_COUNT=$((ERROR_COUNT + $?))

# Run integration tests
run_tests "Integration" "npx jest --selectProjects integration --colors"
ERROR_COUNT=$((ERROR_COUNT + $?))

# Print summary
echo -e "\n${BLUE}===========================================${NC}"
if [ $ERROR_COUNT -eq 0 ]; then
  echo -e "${GREEN}All tests passed successfully!${NC}"
  exit 0
else
  echo -e "${RED}Tests completed with $ERROR_COUNT test suites failing${NC}"
  exit 1
fi