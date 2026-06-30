import sys
import time
import traceback

# Add package directory to path if needed (done by running as module)
from backend.tests import test_rag, test_agents

def run_test_module(module, name):
    print(f"\nRunning tests in {name}...")
    print("-" * 50)
    
    # Find all test functions in the module
    test_functions = [getattr(module, attr) for attr in dir(module) if attr.startswith("test_") and callable(getattr(module, attr))]
    
    passed = 0
    failed = 0
    
    for func in test_functions:
        func_name = func.__name__
        print(f"  Running {func_name}... ", end="", flush=True)
        start = time.time()
        try:
            func()
            duration = (time.time() - start) * 1000
            print(f"[ PASS ] ({duration:.1f}ms)")
            passed += 1
        except Exception as e:
            duration = (time.time() - start) * 1000
            print(f"[ FAIL ] ({duration:.1f}ms)")
            print("\n--- TEST FAILURE DETAILS ---")
            traceback.print_exc()
            print("----------------------------\n")
            failed += 1
            
    return passed, failed

def main():
    print("=" * 60)
    print(" KSP CRIME COPILOT — AUTOMATED TEST RUNNER ".center(60, "="))
    print("=" * 60)
    
    start_time = time.time()
    
    # Run RAG Tests
    rag_pass, rag_fail = run_test_module(test_rag, "backend/tests/test_rag.py")
    
    # Run Agent Tests
    agent_pass, agent_fail = run_test_module(test_agents, "backend/tests/test_agents.py")
    
    total_pass = rag_pass + agent_pass
    total_fail = rag_fail + agent_fail
    duration = time.time() - start_time
    
    print("\n" + "=" * 60)
    print(" TEST EXECUTION SUMMARY ".center(60, "="))
    print("=" * 60)
    print(f"  Total Duration : {duration:.3f} seconds")
    print(f"  Tests Passed   : {total_pass}")
    print(f"  Tests Failed   : {total_fail}")
    print("=" * 60)
    
    if total_fail > 0:
        print(">>> RESULT: SOME TESTS FAILED <<<")
        sys.exit(1)
    else:
        print(">>> RESULT: ALL TESTS PASSED SUCCESSFULLY <<<")
        sys.exit(0)

if __name__ == "__main__":
    main()
