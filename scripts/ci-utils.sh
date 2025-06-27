#!/bin/bash

# CI Utilities - Helper functions for GitHub Actions management

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REPO="UtakataKyosui/ChunkPomodoroExtension"
BRANCH="build-to-zipfile-release"

# Function to check current CI status
check_ci_status() {
    echo -e "${BLUE}🔍 Checking CI status for ${REPO}...${NC}"
    
    gh run list \
        --repo "${REPO}" \
        --branch "${BRANCH}" \
        --limit 5 \
        --json conclusion,status,databaseId,headBranch,workflowName,createdAt \
        --template '{{range .}}{{.databaseId}} | {{.workflowName}} | {{.status}} | {{.conclusion}} | {{.createdAt}}
{{end}}'
}

# Function to get logs for a specific run
get_logs() {
    local run_id=${1:-$(get_latest_run_id)}
    
    if [ -z "$run_id" ]; then
        echo -e "${RED}❌ No run ID provided and couldn't get latest run${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}📋 Fetching logs for run ${run_id}...${NC}"
    gh run view "${run_id}" --repo "${REPO}" --log
}

# Function to get latest run ID
get_latest_run_id() {
    gh run list \
        --repo "${REPO}" \
        --branch "${BRANCH}" \
        --limit 1 \
        --json databaseId \
        --jq '.[0].databaseId'
}

# Function to cancel current runs
cancel_runs() {
    echo -e "${YELLOW}🛑 Cancelling running workflows...${NC}"
    
    local running_runs=$(gh run list \
        --repo "${REPO}" \
        --branch "${BRANCH}" \
        --status in_progress \
        --json databaseId \
        --jq '.[].databaseId')
    
    if [ -z "$running_runs" ]; then
        echo -e "${GREEN}✅ No running workflows to cancel${NC}"
        return 0
    fi
    
    for run_id in $running_runs; do
        echo -e "${YELLOW}🛑 Cancelling run ${run_id}...${NC}"
        gh run cancel "${run_id}" --repo "${REPO}"
    done
    
    echo -e "${GREEN}✅ All running workflows cancelled${NC}"
}

# Function to trigger workflow manually
trigger_workflow() {
    local workflow_name=${1:-"release.yml"}
    local version_type=${2:-"patch"}
    
    echo -e "${BLUE}🚀 Triggering workflow: ${workflow_name}${NC}"
    
    gh workflow run "${workflow_name}" \
        --repo "${REPO}" \
        --ref "${BRANCH}" \
        --field version_type="${version_type}"
    
    echo -e "${GREEN}✅ Workflow triggered${NC}"
    echo -e "${BLUE}💡 Use 'check_ci_status' to monitor progress${NC}"
}

# Function to watch CI in real-time
watch_ci() {
    local interval=${1:-30}
    
    echo -e "${BLUE}👀 Watching CI status (refresh every ${interval}s)${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
    
    while true; do
        clear
        echo -e "${BLUE}=== CI Status for ${REPO} (${BRANCH}) ===${NC}"
        echo -e "${BLUE}Last updated: $(date)${NC}"
        echo
        check_ci_status
        echo
        echo -e "${YELLOW}Refreshing in ${interval} seconds...${NC}"
        sleep "${interval}"
    done
}

# Function to show help
show_help() {
    echo -e "${BLUE}CI Utilities - Helper commands${NC}"
    echo
    echo -e "${GREEN}Available commands:${NC}"
    echo -e "  ${YELLOW}check_ci_status${NC}     - Show recent CI runs"
    echo -e "  ${YELLOW}get_logs [run_id]${NC}   - Get logs for specific or latest run"
    echo -e "  ${YELLOW}cancel_runs${NC}         - Cancel all running workflows"
    echo -e "  ${YELLOW}trigger_workflow${NC}    - Manually trigger workflow"
    echo -e "  ${YELLOW}watch_ci [interval]${NC} - Watch CI status in real-time"
    echo
    echo -e "${GREEN}Examples:${NC}"
    echo -e "  ${BLUE}bash scripts/ci-utils.sh check_ci_status${NC}"
    echo -e "  ${BLUE}bash scripts/ci-utils.sh get_logs 123456${NC}"
    echo -e "  ${BLUE}bash scripts/ci-utils.sh watch_ci 15${NC}"
}

# Main function to handle commands
main() {
    case "${1:-help}" in
        "check_ci_status"|"status")
            check_ci_status
            ;;
        "get_logs"|"logs")
            get_logs "$2"
            ;;
        "cancel_runs"|"cancel")
            cancel_runs
            ;;
        "trigger_workflow"|"trigger")
            trigger_workflow "$2" "$3"
            ;;
        "watch_ci"|"watch")
            watch_ci "$2"
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            echo -e "${RED}❌ Unknown command: $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi