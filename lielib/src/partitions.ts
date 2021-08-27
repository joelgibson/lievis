export namespace partitions {

/** Predicate testing whether A[0] >= A[1] >= ... >= A[n] */
function isWeaklyDecreasing(nums: number[]): boolean {
    for (let i = 0; i < nums.length - 1; i++)
        if (nums[i] < nums[i + 1])
            return false

    return true
}

/** Predicate testing whether an array of integers is a partition: a weakly decreasing
 * list of nonnegative integers. */
export function isPartition(parts: number[]) {
    return (parts.length == 0) || (isWeaklyDecreasing(parts) && parts[parts.length - 1] > 0)
}

}
