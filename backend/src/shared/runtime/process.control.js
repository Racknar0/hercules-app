let cancelFlag = false;

export function requestCancel() {
    cancelFlag = true;
}

export function resetCancel() {
    cancelFlag = false;
}

export function isCancelRequested() {
    return cancelFlag;
}
