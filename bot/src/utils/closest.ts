export function findClosest(arr: Array<number>, target: number): number {
    let left = 0;
    let right = arr.length - 1;

    while (left < right) {
        if (Math.abs(arr[left] - target) <= Math.abs(arr[right] - target)) right--;
        else left++;
    }

    return arr[left];
}
