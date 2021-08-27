#!/usr/bin/env sh

# Run make in a loop, waiting each time until one of the "watched files" changes.

trap "echo Exited!; exit;" SIGINT SIGTERM
make;
while fswatch --one-event $(make watchfiles); do
    make;
done;
